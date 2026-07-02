namespace BikeService.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
    public NotFoundException(string resourceName, int id)
        : base($"{resourceName} o id {id} nie istnieje.") { }
}

public class BusinessException : Exception
{
    public BusinessException(string message) : base(message) { }
}

public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "Brak uprawnień do wykonania tej operacji.")
        : base(message) { }
}

public class ConflictException : Exception
{
    public ConflictException(string message = "Dane zostały zmodyfikowane przez inną osobę. Odśwież stronę i spróbuj ponownie.")
        : base(message) { }
}